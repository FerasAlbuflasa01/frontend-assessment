import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrDetailComponent } from './cr-detail.component';
import { SessionService } from '../../session/session.service';
import { users } from '../../api/fixtures';
import { ReqUser } from '../../models/cr.models';

const flush = () => new Promise((r) => setTimeout(r, 0));

async function render(user: ReqUser, id: string): Promise<ComponentFixture<CrDetailComponent>> {
	TestBed.configureTestingModule({
		imports: [CrDetailComponent],
		providers: [{ provide: SessionService, useValue: { user } }],
	});
	await TestBed.compileComponents();
	const fixture = TestBed.createComponent(CrDetailComponent);
	fixture.componentInstance.id = id;
	fixture.detectChanges(); // ngOnInit -> load()
	await flush(); // let the mock API resolve
	fixture.detectChanges(); // render the loaded state
	return fixture;
}

describe('CrDetailComponent', () => {
	it('loads and renders the change request title', async () => {
		const fixture = await render(users.approver, 'CR-1');
		expect(fixture.nativeElement.querySelector('.cr-detail__header h2').textContent).toContain('Add 1 unit of SKU-A');
	});

	it('disables Approve for a read-only viewer on a pending CR', async () => {
		const fixture = await render(users.viewer, 'CR-1'); // viewer: cr_r_o only; CR-1 is PENDING_APPROVAL
		const approveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__approve');
		expect(approveBtn.disabled).toBe(true);
	});

	it('enables Approve for an approver on a pending CR', async () => {
		const fixture = await render(users.approver, 'CR-1'); // approver: cr_r_o + cr_a_o; CR-1 is PENDING_APPROVAL
		const approveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__approve');
		expect(approveBtn.disabled).toBe(false);
	});
	
	it('disables Approve for an approver on an applied CR', async () => {
		const fixture = await render(users.approver, 'CR-2'); // approver: cr_r_o + cr_a_o; CR-2 is APPLIED
		const approveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__approve');
		expect(approveBtn.disabled).toBe(true);
	});

	it('shows timeline entries in reverse chronological order', async () => {
		const fixture = await render(users.approver, 'CR-1');
		const entries: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.cr-timeline__entry');
		expect(entries.length).toBe(3);
		
		expect(entries[0].textContent).toContain('CREATE');
		expect(entries[1].textContent).toContain('SUBMIT');
		expect(entries[2].textContent).toContain('SEND_FOR_APPROVAL');
	});

	it('approves a change request', async () => {
		const fixture = await render(users.approver, 'CR-1');
		const approveBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__approve');

		approveBtn.click();
		await fixture.componentInstance.approve();
		fixture.detectChanges();

		expect(fixture.componentInstance.detail?.status).toBe('APPROVED');
	});

	it('rejects a change request with a reason', async () => {
		const fixture = await render(users.approver, 'CR-1');
		const reasonInput: HTMLTextAreaElement = fixture.nativeElement.querySelector('.cr-actions__reason');
		const rejectBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.cr-actions__reject-btn');

		reasonInput.value = 'Not acceptable';
		reasonInput.dispatchEvent(new Event('input'));
		fixture.detectChanges();

		expect(rejectBtn.disabled).toBe(false);
		expect(fixture.componentInstance.rejectControl.value).toBe('Not acceptable');
		expect(fixture.componentInstance.rejectControl.valid).toBe(true);

		rejectBtn.click();
		await fixture.componentInstance.reject();
		fixture.detectChanges();

		expect(fixture.componentInstance.detail?.status).toBe('REJECTED');
	});

	it('reject does not show to a viewer', async () => {
		const fixture = await render(users.viewer, 'CR-1');
		const buttonNativeElement: HTMLButtonElement | null = 
    fixture.nativeElement.querySelector('button.reject-btn');
  	expect(buttonNativeElement).toBeNull();
	});

		it('reject does not show to a viewer', async () => {
		const fixture = await render(users.viewer, 'CR-1');
		const buttonNativeElement: HTMLButtonElement | null = 
    fixture.nativeElement.querySelector('button.reject-btn');
  	expect(buttonNativeElement).toBeNull();
	});

	

});

